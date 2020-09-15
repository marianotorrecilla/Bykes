const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const multer = require('multer');
const { check, validationResult, body } = require('express-validator');
const db = require('../database/models/');
const User = db.User;
const Address = db.Address;

const Op = db.Sequelize.Op;


module.exports = {
    index : function(req, res){
        res.render(path.resolve(__dirname, '..','views','usuarios','register'));
    },
    processRegister: (req, res) => {
        let errors = validationResult(req);
       
        if (errors.isEmpty()) {
          let direccionARegistrar = {
            streetName: req.body.direccion,
            additionalNumbers: req.body.pisoDepto ? req.body.pisoDepto : '',
            zipCode: req.body.cp,
            province: req.body.provincia,
            neighbourhood: req.body.localidad
          }
          Address.create(direccionARegistrar)
          .then((storedAddress) => {
            let usuarioARegistrar = {
              firstName: req.body.nombre,
              lastName: req.body.apellido,
              dni: req.body.dni,
              phoneNumber: req.body.telefono,
              email: req.body.email,
              password: bcrypt.hashSync(req.body.password, 10),
              image: req.file ? req.file.filename : '',
              category: req.body.email.indexOf('@bykes.com')!= -1 ? 9 : 0,  // UsuarioBasico = 0, Administrador = 9
              idAddress: storedAddress.id
            }
          User.create(usuarioARegistrar).then(storedUser => 
            res.redirect('/login')
          )
          })
        } else {  
          return res.render(path.resolve(__dirname, '../views/usuarios/register'), {
            errors: errors.mapped(),  old: req.body
          });
        }
     },

    login : function(req, res){
        res.render(path.resolve(__dirname, '..','views','usuarios','login'));
    },
    processLogIn: function(req,res){
      let errors = validationResult(req);
      if (errors.isEmpty()) {
        let usuarioLogueado = {
          email: req.body.email,
          password: req.body.password,
        }

        User.findAll({
          where: {
            email: req.body.email,
          }
        })
        .then((user) => {
          req.session.user = user[0];
        
          if (req.body.recuerdame){
            let mailUsuarioLogueado = usuarioLogueado.email;
            res.cookie('galletita', mailUsuarioLogueado, {maxAge: 1000*60*60*24});
          }
          res.redirect('/');

        })
      }
       else {
        return res.render(path.resolve(__dirname, '..','views','usuarios','login'), { errors: errors.mapped(), old: req.body});
      }
    },
    usuarios: function(req,res){ 
      const usuarios = User.findAll();
      Promise.all([usuarios])
      .then(([usuarios]) =>{
        res.render(path.resolve(__dirname, '..','views','usuarios','listadoUsuarios'),{usuarios});
      })
    },
    show: (req,res)=>{
      User.findByPk(req.params.id)
      .then(miUsuario =>{
        res.render(path.resolve(__dirname, '..','views','usuarios','detalleUsuario'), {miUsuario:miUsuario})
      })
      .catch(error => res.send(error))
    },
    edit: (req,res) => { 
      User.findByPk(req.params.id, {
        include: ['addresses']
      })
      .then(usuarioEditar => {
          res.render(path.resolve(__dirname, '..','views','usuarios','editUsuarios'), {usuarioEditar});
      })
    },
    updateUsuarios: (req,res) =>{
      const errors = validationResult(req);

      if(errors.isEmpty()) {
        const usuarioAEditar = {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          dni: req.body.dni,
          phoneNumber: req.body.phoneNumber,
          email: req.body.email,
          image: req.file ? req.file.filename : req.body.oldImagen,
          category: req.body.category
        };
        const direccionAEditar = {
          streetName: req.body.streetName,
          additionalNumbers: req.body.additionalNumbers,
          zipCode: req.body.zipCode,
          province: req.body.province,
          neighbourhood: req.body.neighbourhood
        };
        
  
        User.findAll({where: {id: req.params.id}
        })
        .then(usuarioConsultado =>{
          const direccionId = usuarioConsultado[0].idAddress;
          
          Address.update(direccionAEditar,{
            where: {id: direccionId}
          })
        })
        User.update(usuarioAEditar, {
          where: {id : req.params.id}
        })
        .then(updatedUser =>{      
          res.redirect('/usuarios')
        })
        .catch(error=> res.send(error));
      }else{
        User.findByPk(req.params.id,{
          include: ['addresses']
        })
        .then( usuarioEditar=>{
          return res.render(path.resolve(__dirname, '..','views','usuarios','editUsuarios'), { errors: errors.mapped(), old: req.body, usuarioEditar});

        })
        

      }
    },    
    destroy: (req,res) => {
      User.destroy({
              where : {
                 id:  req.params.id
              },
              force : true 
      })
      .then(confirm =>{
              res.redirect('/usuarios');
      })
    },
    search: ( req, res) =>{
      User.findAll({
          where:{
              lastName: {[Op.like]: `%${req.query.search}%`}
          }
      })
      .then(resultado => { res.render(path.resolve(__dirname, '..', 'views', 'usuarios', 'listadoUsuarios'),{usuarios: resultado});})
      .catch(error => res.send(error))
    },
    logout: (req,res) =>{
      req.session.destroy();
      res.cookie('galletita',null,{maxAge: -1});
      res.redirect('/login')
    },

}