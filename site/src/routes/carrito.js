const express = require('express');
const router = express.Router();
const path = require('path');

const carritoController = require(path.resolve(__dirname,'..','controllers','carritoController'));

router.post('/carrito/agregar', carritoController.addCart);
router.get('/carrito/lista', carritoController.lista);
router.post('/carrito/lista/borrarProducto', carritoController.deleteArt);
router.post('/carrito/comprar', carritoController.comprar);

//router.get('/carrito/envio', carritoController.envio);
//router.get('/carrito/pago', carritoController.pago);
//router.get('/carrito/confirmacion', carritoController.confirmacion);

module.exports = router;