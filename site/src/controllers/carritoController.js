const path = require('path');
const fs = require('fs');
const db = require('../database/models');
const Article = db.Article;
const Style = db.Style;
const Item = db.Item;
const {check,validationResult,body} = require('express-validator');

const mercadopago = require('mercadopago')

mercadopago.configure({
    access_token : 'APP_USR-6317427424180639-042414-47e969706991d3a442922b0702a0da44-469485398',
    integrator_id : 'dev_24c65fb163bf11ea96500242ac130004',
})


module.exports = {
    addCart: (req,res) =>{
        //return res.send(req.body)
        const errores = validationResult(req);
        if(errores.isEmpty()){
            Article.findByPk(req.body.idArticle,{
                include: ['style']
            })
            .then((producto)=>{
                //return res.send(producto)
                let price = Number(producto.price)
                let salePrice = (price - ((price * producto.discount) / 100))  
                //console.log(salePrice + '====================================')
                return Item.create({
                    salePrice: salePrice,
                    subtotal: salePrice,
                    state: 1,
                    idUser: req.session.user.id,
                    idArticle: producto.id,
                    cartId: null
                })
                .then(()=> res.redirect('/productos'))
                .catch(error => console.log(error))
            })

        }else{
            //Hay errores
            Article.findByPk(req.body.idArticle,{
                include: ['style']
            })
            .then((miBiciDetalle)=>{
                return res.render(path.resolve(__dirname, '..','views','productos','detalle'), {miBiciDetalle})
            })
         }
    },
    lista : function(req, res){
        Item.findAll({
            where:{
                idUser : req.session.user.id,
                state: 1
            },
            include:{
                all: true,
                nested: true
            }
        })
        .then((cartArticle)=>{
            //return res.send(cartProducto)
            
            let total = cartArticle.reduce((total, item)=>(total = total + (Number(item.subtotal))),0)
            return res.render(path.resolve(__dirname, '..','views','carrito','lista'), {
                cartArticle, total})
            
        })
        //res.render(path.resolve(__dirname, '..','views','carrito','lista'));
        
    },

    deleteArt: (req,res) =>{
        Item.destroy({
            where: {
                id : req.body.itemId
            }
        })
        .then(()=> res.redirect('/carrito/lista'))
        .catch(error => console.log(error))
    },

    comprar: (req, res) => {

        let preference = {

            
            payment_methods : {

                excluded_payment_methods : [
                    {id : 'amex'}
                ],

                excluded_payment_types : [
                    {id : 'atm'}
                ],

                installments : 6
            },
            
            items: [
                {
                    id: 1234,
                    picture_url : 'http://localhost:3000/images/bicicletas/bici-1607818501981.jpg',
                    title: 'CINELLI PISTA 19',
                    description : 'Bici Fachera',
                    unit_price : 55000,
                    quantity : 1
                }
            ],

            
        }

        mercadopago.preferences.create(preference).then(response => {

            global.init_point = response.body.init_point
            res.render(path.resolve(__dirname, '..','views','carrito','confirm'))


        }).catch(error => {
            console.log(error);
            res.send('error')
        })
    }

    /*envio : function(req, res){
        //res.sendFile(path.resolve(__dirname, '..','views','carrito','envio.html'));
        res.render(path.resolve(__dirname, '..','views','carrito','envio'));
        
    },
    pago : function(req, res){
        //res.sendFile(path.resolve(__dirname, '..','views','carrito','pago.html'));
        res.render(path.resolve(__dirname, '..','views','carrito','pago'));
        
    },
    confirmacion : function(req, res){
        //res.sendFile(path.resolve(__dirname, '..','views','carrito','confirmacion.html'));
        res.render(path.resolve(__dirname, '..','views','carrito','confirmacion'));
        
    }*/
    
}