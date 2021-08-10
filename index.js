const dotEnv = require('dotenv')
dotEnv.config()
const express = require('express')
const app = express()
const { Pool, Client, Query } = require('pg')
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
})
const jwt = require('jsonwebtoken')
const crypto = require('crypto');
const { Console } = require('console')


const port = process.env.SERVER_PORT
app.listen(port, () => console.log('server started'))


// login: employee number, and a password.
app.post('/login', async (req, res) => {
    const hashedPassword = crypto.createHash('sha512').update(req.query.password).digest('hex')
    const data = await pool.query("SELECT employee_id FROM employees WHERE employee_number = " + req.query.employee_number + " AND password = '" + hashedPassword + "'")
    if (data.rowCount == 1)
        jwt.sign({ user: data.rows[0] }, 'secretkey', (err, token) => {
            res.json({ token })
        })
    else {
        res.json('error')
    }
})

//signup: Each user will have a name, an employee number, and a password. 
app.post('/signup', async (req, res) => {
    if (req.query.employee_number.toString().length == 4 && req.query.password.length > 5) {
        const checkUser = await pool.query("SELECT employee_id FROM employees WHERE employee_number = " + req.query.employee_number)
        if (checkUser.rowCount == 0) {
            const hashedPassword = crypto.createHash('sha512').update(req.query.password).digest('hex')
            const insertQuery = await pool.query("INSERT INTO employees(employee_number, employee_name, password) VALUES (" + req.query.employee_number + ", '" + req.query.employee_name + "', '" + hashedPassword + "')")
            const user = await pool.query("SELECT employee_id FROM employees WHERE employee_number = " + req.query.employee_number + " AND password = '" + hashedPassword + "'")
            jwt.sign({ user: user.rows[0] }, 'secretkey', (err, token) => {
                res.json({ token })
            })
        } else {
            res.json('error: employee number is used')
        }
    } else
        res.json('error: employee number or password is invalid')
})

//check available timeslotes: return all vailable timeslotes from now untel the end of the day for spicific number of chairs
app.get('/check_timeslotes', verifyToken, (req, res) => {
    jwt.verify(req.token, 'secretkey', async (err, authData) => {
        if (!err) {
            let numberOfChairs = req.query.number_of_chairs
            const tablesQuery = await pool.query("SELECT table_id, number_of_chairs FROM tables WHERE number_of_chairs >= " + req.query.number_of_chairs + " AND is_active = true ")
            const tables = []
            if (typeof tablesQuery.rows[0] != 'undefined') {
                for (let index = 0; index < tablesQuery.rows.length; index++) {
                    if (tablesQuery.rows[index].number_of_chairs == numberOfChairs)
                        tables.push(tablesQuery.rows[index])
                }
                let min = Math.pow(10, 1000)
                if (tables.length == 0) {
                    for (let index = 0; index < tablesQuery.rows.length; index++) {
                        min = Math.min(tablesQuery.rows[index].number_of_chairs, min)
                    }
                    if (min == Math.pow(10, 1000))
                        res.json({
                            error: 'no table available',
                            authData
                        })
                    else {
                        numberOfChairs = min
                        for (let index = 0; index < tablesQuery.rows.length; index++) {
                            if (tablesQuery.rows[index].number_of_chairs == numberOfChairs)
                                tables.push(tablesQuery.rows[index])
                        }
                    }
                }
                const timeslots = (await pool.query("SELECT * FROM reservation_timeslots WHERE start_at >= CURRENT_TIME")).rows
                if (timeslots.length != 0) {
                    let reservationsQuery1Condition = timeslots[0].reservation_timeslot_id.toString()
                    for (let index = 1; index < timeslots.length; index++) {
                        reservationsQuery1Condition += ' OR reservation_timeslot_id = ' + timeslots[index].reservation_timeslot_id.toString()
                    }
                    let reservationsQuery2Condition = tables[0].table_id.toString()
                    for (let index = 1; index < tables.length; index++) {
                        reservationsQuery2Condition += ' OR table_id = ' + tables[index].table_id.toString()
                    }
                    const reservations = (await pool.query("SELECT * FROM reservations WHERE (reservation_timeslot_id = " + reservationsQuery1Condition + ") AND (table_id = " + reservationsQuery2Condition + ") AND (reservation_date = CURRENT_DATE)")).rows
                    const availableReservations = []
                    for (let i = 0; i < timeslots.length; i++) {
                        console.log(tables)
                        if (reservations.length != 0) {
                            for (let j = 0; j < reservations.length; j++) {
                                for (let k = 0; k < tables.length; k++) {
                                    if (!((timeslots[i].reservation_timeslot_id == reservations[j].reservation_timeslot_id) && (reservations[j].table_id == tables[k].table_id)))
                                        availableReservations.push({
                                            reservation_timeslot_id: timeslots[i].reservation_timeslot_id,
                                            table_id: tables[k].table_id,
                                            time: timeslots[i].start_at + ' - ' + timeslots[i].end_at
                                        })
                                }
                            }
                        }
                        else {
                            for (let j = 0; j < tables.length; j++) {
                                availableReservations.push({
                                    reservation_timeslot_id: timeslots[i].reservation_timeslot_id,
                                    table_id: tables[j].table_id,
                                    time: timeslots[i].start_at + ' - ' + timeslots[i].end_at
                                })
                            }
                        }
                    }
                    res.json({
                        availableReservations,
                        authData
                    })
                }
                else
                    res.json({
                        error: 'no reservation available',
                        authData
                    })
            }
            else
                res.json({
                    error: 'no table available',
                    authData
                })
        } else {
            res.sendStatus(403)
        }
    })
})

//Restaurant employee can add a new reservation for a table at a specific time slot.
app.post('/new_reservation', verifyToken, async (req, res) => {
    jwt.verify(req.token, 'secretkey', async (err, authData) => {
        if (!err) {
            const checkIfAvailable = await pool.query("SELECT * FROM reservations WHERE reservation_timeslot_id = " + req.query.reservation_timeslot_id + " AND table_id = " + req.query.table_id + " AND reservation_date = CURRENT_DATE")
            if (checkIfAvailable.rows.length == 0) {
                const insertQuery = await pool.query("INSERT INTO reservations(reservation_timeslot_id, table_id, reservation_date) VALUES (" + req.query.reservation_timeslot_id + ", " + req.query.table_id + ", CURRENT_DATE)")
                res.json({
                    states: 'success', authData, insertQuery
                })
            } else
                res.json({ error: 'this table is not available at this time' })
        }
        else res.sendStatus(403)
    })
})

//Restaurant employees can view all reservations for the current working day. 
app.get('/get_reservation', verifyToken, async (req, res) => {
    jwt.verify(req.token, 'secretkey', async (err, authData) => {
        if (!err) {
            let queryString = "SELECT * FROM reservations LEFT JOIN reservation_timeslots ON reservations.reservation_timeslot_id = reservation_timeslots.reservation_timeslot_id WHERE reservation_date = CURRENT_DATE ORDER BY start_at"
            const pageNumber = req.query.page_number
            const isAscending = req.query.is_ascending == 'true'
            if (!isAscending) {
                queryString += " DESC"
            }
            if (pageNumber == 1)
                queryString += " LIMIT 10"
            else
                queryString += " OFFSET " + ((pageNumber - 1) * 10) + " LIMIT 10"
            const getReservationQuery = await pool.query(queryString)
            const countQuery = await pool.query("SELECT COUNT(*) FROM reservations WHERE reservation_date = CURRENT_DATE")
            const hasNextPage = countQuery.rows[0].count > ((pageNumber) * 10)
            res.json({
                reservation: getReservationQuery.rows,
                hasNextPage,
                pageNumber,
                authData
            })
        }
        else res.sendStatus(403)
    })
})

//Restaurant employee can delete a specific reservation for the current working day. 
app.delete('/delete_reservation', verifyToken, async (req, res) => {
    jwt.verify(req.token, 'secretkey', async (err, authData) => {
        if (!err) {
            const deleteQuery = await pool.query("DELETE FROM reservations WHERE reservation_id = '" + req.query.reservation_id + "'")
            console.log(deleteQuery)
            res.json({
                states: deleteQuery.rowCount == 1 ? 'success' : 'no such data reservation',
                authData
            })
        } else res.sendStatus(403)
    })
})



function verifyToken(req, res, next) {
    const token = req.query.token
    if (typeof token != 'undefined') {
        req.token = token
        next()
    }
    else
        res.sendStatus(403)
}