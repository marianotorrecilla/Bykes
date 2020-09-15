const path = require('path');
const fs = require('fs');
const db = require('../database/models');
const Article = db.Article;
const Style = db.Style;
const {check,validationResult,body} = require('express-validator');

const Op = db.Sequelize.Op;

module.exports = {
    admin : function(req, res){
        const bicicletas = Article.findAll();
        const estilos = Style.findAll();
        Promise.all([bicicletas,estilos]) 
        .then(([bicicletas,estilos]) =>{
            res.render(path.resolve(__dirname, '..','views','administrador','listadoProductos'),{bicicletas,estilos});
        })
    },
    create: function (req, res){
        res.render(path.resolve(__dirname, '..','views','administrador','create'));
    },
    save: (req,res)=>{
        let errors = validationResult(req);
       
        if (errors.isEmpty()) {
            let nuevaBici = {
                brand: req.body.marca,
                model: req.body.modelo,
                styleId: req.body.estilo,
                description: req.body.descripcion,
                techDescription: req.body.descripcionTecnica,
                colors: req.body.colores,
                size: req.body.talle,
                shot: req.body.rodado,
                price: req.body.precio,
                discount: req.body.descuento,
                financing: req.body.cuotas,
                financingSize: req.body.cantCuotas,
                image: req.file ? req.file.filename : '',
            };
            Article.create(nuevaBici, {
                include: ['style']
            })
            .then( bici =>{
                res.redirect('/administrador');
            })
        }else{
            return res.render(path.resolve(__dirname, '../views/administrador/create'), {
                errors: errors.mapped(),  old: req.body
              });
        }        
    },
    show: (req,res)=>{
        Article.findByPk(req.params.id, {
            include: ['style']
        })  
        .then(miBici =>{
            res.render(path.resolve(__dirname, '..','views','administrador','detalleAdmin'), {miBici:miBici})
        })  
        .catch(error => res.send(error))
    
    },
    edit: (req,res) => { //! Listo
        Article.findByPk(req.params.id)
        .then(biciEditar => {
            res.render(path.resolve(__dirname, '..','views','administrador','edit'), {biciEditar});
        })
    },
    update: (req,res) =>{

        let errors = validationResult(req);

        if(errors.isEmpty()){

        
        const _body = req.body;
        //return res.send(_body);
        _body.brand = req.body.marca,
        _body.model = req.body.modelo,
        _body.styleId = req.body.estilo,
        _body.description = req.body.descripcion,
        _body.techDescription = req.body.descripcionTecnica,
        _body.colors =  req.body.colores,
        _body.size =  req.body.talle,
        _body.shot =  req.body.rodado,
        _body.price =  req.body.precio,
        _body.discount = req.body.descuento,
        _body.financing = req.body.cuotas,
        _body.financingSize = req.body.cantCuotas,
        _body.image = req.file ? req.file.filename : req.body.oldImagen    // if ternario       

        Article.update(_body ,{
            where : {
                id : req.params.id
            },
            include: ['style']
        })
        .then(bicicleta =>{
            res.redirect('/administrador')
        })
        .catch(error => res.send(error));     //error de Base de Datos
        
    }else{
        Article.findByPk(req.params.id,{
            include: ['style']
        })
        .then(biciEditar=>{
            return res.render(path.resolve(__dirname, '..','views','administrador','edit'), {errors: errors.errors, biciEditar})
        })        
    }
    },
    destroy: (req,res) => {
        Article.destroy({
                where : {
                   id:  req.params.id
                },
                force : true 
        })
        .then(confirm =>{
                res.redirect('/administrador');
        })
    },
    search: ( req, res) =>{
        Article.findAll({
            where:{
                brand: {[Op.like]: `%${req.query.search}%`}
            }
        })
        .then(resultado => { res.render(path.resolve(__dirname, '..', 'views', 'administrador', 'listadoProductos'),{bicicletas: resultado});})
        .catch(error => res.send(error))
    },
    


    //------------------------CUSTOM----------------------
    listadoCustom: function (req, res){
        let biciscustom = JSON.parse(fs.readFileSync(path.resolve(__dirname,'..','data','biciscustom.json')));
        res.render(path.resolve(__dirname, '..','views','administrador','custom','listadoCustom'),{biciscustom});
    },
    customCreate: function (req, res){
        let biciscustom = JSON.parse(fs.readFileSync(path.resolve(__dirname,'..','data','biciscustom.json')));
        res.render(path.resolve(__dirname, '..','views','administrador','custom','customCreate'),{biciscustom});
    },
    customSave: (req,res)=>{
        //leemos el json de nuestras bicicletas custom
        let biciscustom = JSON.parse(fs.readFileSync(path.resolve(__dirname,'..','data','biciscustom.json')));
        let ultimaBiciCustom = biciscustom.pop();
        biciscustom.push(ultimaBiciCustom);
 
        let nuevaBiciCustom={
            id: ultimaBiciCustom.id +1,
            estilo: req.body.estilo,
            nombre: req.body.nombre,
            colores: req.body.colores,
            talle: req.body.talle,
            rodado: req.body.rodado,
            descripcionTecnica: req.body.descripcionTecnica,
            precio: req.body.precio,
            descuento: req.body.descuento,
            cuotas: req.body.cuotas,
            cantCuotas: req.body.cantCuotas,
            imagen : req.file.filename
        };
            //Aquí se agrega al array el nuevo Producto
            biciscustom.push(nuevaBiciCustom);
            //Convertir mi array en un string
            let nuevaBiciCustomGuardar = JSON.stringify(biciscustom,null,2)
            //Guardar o reemplazar nuestro archivo JSON
            fs.writeFileSync(path.resolve(__dirname,'..','data','biciscustom.json'), nuevaBiciCustomGuardar);
            res.redirect('/administrador/custom');
    },
    customShow: (req,res)=>{
        let biciscustom = JSON.parse(fs.readFileSync(path.resolve(__dirname,'..','data','biciscustom.json')));
        
        let miBiciCustom;
        biciscustom.forEach(bicic => {
           if(bicic.id == req.params.id){
               miBiciCustom = bicic;         
            }
        });
        res.render(path.resolve(__dirname, '..','views','administrador','custom','detalleCustom'), {miBiciCustom:miBiciCustom})
    
    },
    customEdit: (req,res) =>{
        let biciscustom = JSON.parse(fs.readFileSync(path.resolve(__dirname,'..','data','biciscustom.json')));

        const biciCustomId = req.params.id;
        let biciCustomEditar = biciscustom.find(bicic => bicic.id == biciCustomId);
        res.render(path.resolve(__dirname, '..','views','administrador','custom','customEdit'), {biciCustomEditar});
    },
    customUpdate: (req,res) =>{
        let biciscustom = JSON.parse(fs.readFileSync(path.resolve(__dirname,'..','data','biciscustom.json')));

        req.body.id = req.params.id;
        req.body.imagen = req.file ? req.file.filename : req.body.oldImagen; //if ternario en la variable req.body.imagen me esta llegando algo en el req.file, entonces guardame lo q llega en el req.body.oldImagen
        
        let biciCustomUpdate = biciscustom.map(bicic => {
            if(bicic.id == req.body.id){
                return bicic = req.body;
            }
            return bicic;
        });
        
        let bicisCustomActualizar = JSON.stringify(biciCustomUpdate,null,2);
        //Guardar o reemplazar nuestro archivo JSON
        fs.writeFileSync(path.resolve(__dirname,'..','data','biciscustom.json'), bicisCustomActualizar);
        res.redirect('/administrador/custom');
    },
    customDestroy: (req,res) =>{
        let biciscustom = JSON.parse(fs.readFileSync(path.resolve(__dirname,'..','data','biciscustom.json')));
        const biciCustomDeleteId = req.params.id; 
        const bicisCustomFinal = biciscustom.filter(bicic => bicic.id != biciCustomDeleteId);
        let bicisCustomGuardar = JSON.stringify(bicisCustomFinal,null,2);
        //Guardar o reemplazar nuestro archivo JSON
        fs.writeFileSync(path.resolve(__dirname,'..','data','biciscustom.json'), bicisCustomGuardar);
        res.redirect('/administrador/custom');
    },

    
    
}