const express = require('express');
const aplicacion = express();
const mysql = require('mysql')
const bodyParser = require('body-parser')

var pool = mysql.createPool({
    connectionLimit: 20,
    host: 'localhost',
    user:'root',
    password: 'root',
    database: 'blog'
})

aplicacion.use(bodyParser.json())
aplicacion.use(bodyParser.urlencoded({extended: true}))

aplicacion.get('/api/v1/publicaciones/', function (peticion, respuesta){

    pool.getConnection(function(err, connection) {

        const query = `SELECT * FROM publicaciones`

        connection.query(query, function (error, filas, campos){
            respuesta.json({data: filas})
        })
        connection.release()
    })
})

aplicacion.get('/api/v1/publicaciones/:id', function (peticion, respuesta) {

    pool.getConnection(function(err, connection) {
        const query = `SELECT * FROM publicaciones WHERE id=${connection.escape(peticion.params.id)}`
        connection.query(query, function(error, filas, campos) {
            if(filas.length > 0){
                respuesta.json({data: filas[0]})
            }
            else{
                respuesta.status(404)
                respuesta.send({errors: ["No existe la publicación"]})
            }
        })
    })
})

aplicacion.get('/api/v1/autores/', function (peticion, respuesta){

    pool.getConnection(function(err, connection) {

        const query = `SELECT * FROM autores`

        connection.query(query, function (error, filas, campos){
            respuesta.json({data: filas})
        })
        connection.release()
    })
})

aplicacion.get('/api/v1/autores/:id', function (peticion, respuesta) {

    pool.getConnection(function(err, connection) {
        const query = `SELECT * FROM autores WHERE id=${connection.escape(peticion.params.id)}`
        connection.query(query, function(error, filas, campos) {
            if(filas.length > 0){
                respuesta.json({data: filas[0]})
            }
            else{
                respuesta.status(404)
                respuesta.send({errors: ["No se encontró el autor"]})
            }
        })
    })
})

aplicacion.post('/api/v1/autores/', function(peticion, respuesta){
    pool.getConnection(function(err, connection) {

        errores = []

        if(!peticion.body.pseudonimo || peticion.body.pseudonimo == "") {
            errores.push("Pseudonimo inválido")
        }
        if (!peticion.body.email || peticion.body.email == "") {
            errores.push("Email inválido")
          }

        if (errores.length > 0) {
            respuesta.status(400)
            respuesta.json({ errors: errores })
        }else {
            const query = `INSERT INTO autores (pseudonimo,email,contrasena) VALUES 
                (
                    ${connection.escape(peticion.body.pseudonimo)},
                    ${connection.escape(peticion.body.email)},
                    ${connection.escape(peticion.body.contrasena)}
                )`
        }        
        connection.query(query, function (error, filas, campos) {
        const nuevoId = filas.insertId

        const queryConsulta = `SELECT * FROM autores WHERE id=${connection.escape(nuevoId)}`
        connection.query(queryConsulta, function (error, filas, campos) {
            respuesta.status(201)
            respuesta.json({data: filas[0]})
            })
        })
        connection.release()
    })
})

aplicacion.post('/api/v1/procesar_agregar', function (peticion, respuesta) {
    pool.getConnection(function (err, connection) {
      const date = new Date()
      const fecha = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`
      const consulta = `
        INSERT INTO
        publicaciones
        (titulo, resumen, contenido, autor_id, fecha_hora)
        VALUES
        (
          ${connection.escape(peticion.body.titulo)},
          ${connection.escape(peticion.body.resumen)},
          ${connection.escape(peticion.body.contenido)},
          ${connection.escape(peticion.session.usuario.id)},
          ${connection.escape(fecha)}
        )
      `
      connection.query(consulta, function (error, filas, campos) {
        peticion.flash('mensaje', 'Publicación agregada')
        respuesta.redirect("/index")
      })
      connection.release()
    })
  })

aplicacion.delete('/api/v1/publicaciones/:id', function (peticion, respuesta){

    pool.getConnection(function(err, connection) {
        const query = `SELECT * FROM publicaciones WHERE id=${connection.escape(peticion.params.id)}`
        connection.query(query, function (error, filas, campos) {

            if(filas.length > 0){
                const queryDelete = `DELETE FROM publicaciones WHERE id=${peticion.params.id}`
            }else{
                respuesta.status(404)
                respuesta.send({errors: ["No se ha encontrado la publicacion"]})
            }
        })
        connection.release()
    })
})

aplicacion.listen(8080, function(){
    console.log("Servidor iniciado");
});