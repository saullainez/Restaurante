var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var multer = require('multer');
var cloudinary = require("cloudinary");
var method_override = require("method-override");
var app_pass = "123";
var Schema = mongoose.Schema;


cloudinary.config({
    cloud_name: "dxgofkj2b",
    api_key: "977678337344235",
    api_secret: "WFgaFJYbVzf0MQR1ltOePlcMBFA"
});


var app = express();

mongoose.connect("mongodb://localhost/primera_pagina");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(multer({dest: "./uploads"}));
app.use(method_override("_method"));

//Definir el schema de nuestros productos
var productSchemaJSON = {
    titulo:String,
    descripcion:String,
    imagenUrl: String,
    precio: Number
};

var productSchema = new Schema(productSchemaJSON);

productSchema.virtual("imagen.url").get(function(){
    if(this.imagenUrl == "" || this.imagenUrl == "data.png"){
        return "default.jpg";
    }
    
    return this.imagenUrl;
});

var Producto = mongoose.model("Producto", productSchema);

app.set("view engine", "jade");
app.set('port', process.env.PORT || 3000);

app.use(express.static("public"));

app.get("/", function(req,res){
    res.render("index");
});

app.get("/menu", function(solicitud,respuesta){
    Producto.find(function(error,documento){
        if(error){console.log(error);}
        respuesta.render("menu/index",{productos: documento})
    });
});

app.put("/menu/:id",function(solicitud,respuesta){

    if(solicitud.body.pass == app_pass) {
        var data = {
            titulo: solicitud.body.nombre,
            descripcion: solicitud.body.descripcion,
            precio: solicitud.body.precio
        };
        
        if(solicitud.files.hasOwnProperty("imagen")){
            
            cloudinary.uploader.upload(solicitud.files.imagen.path,
            function(result) { 
                data.imagenUrl = result.url;
                
                Producto.update({"_id": solicitud.params.id},data,function(producto){
                    respuesta.redirect("/menu"); 
                });
            });

        }else{
            Producto.update({"_id": solicitud.params.id},data,function(producto){
               respuesta.redirect("/menu"); 
            });
        }
    }else {
        respuesta.redirect("/");
    }
});

app.get("/menu/editar/:id",function(solicitud,respuesta){
    var id_producto = solicitud.params.id;
    
    Producto.findOne({"_id": id_producto},function(error,producto){
        console.log(producto);
        respuesta.render("menu/editar",{producto: producto});
    });
    
});

app.post("/admin",function(solicitud,respuesta){
    if(solicitud.body.password == app_pass){
        Producto.find(function(error,documento){
            if(error){console.log(error);}
            respuesta.render("admin/index",{productos: documento})
        });
    }else {
        respuesta.render("index")
    }
});    
    
app.get("/admin",function(solicitud,respuesta){
    respuesta.render("admin/form");
});    


app.post("/menu", function(solicitud,respuesta){
    if(solicitud.body.pass == app_pass){
        var data = {
            titulo: solicitud.body.nombre,
            descripcion: solicitud.body.descripcion,
            precio: solicitud.body.precio
        }
    
        var product = new Producto(data);
        
        if(solicitud.files.hasOwnProperty("imagen")){
            
            cloudinary.uploader.upload(solicitud.files.imagen.path,
                function(result) { 
                    product.imagenUrl = result.url;
                    product.save(function(err){
                        console.log(product);
                        respuesta.redirect("/menu");
                    });
            });
        }else{
            product.save(function(err){
                console.log(product);
                respuesta.redirect("/menu");
            });
        }
        

    }else{
        respuesta.render("menu/new");
    }
    
});

app.get("/menu/new",function(solicitud,respuesta){
    respuesta.render("menu/new")
});

app.get("/menu/delete/:id", function(solicitud,respuesta){
    var id = solicitud.params.id;
    
    Producto.findOne({"_id": id}, function(err, producto){
        respuesta.render("menu/delete", {producto: producto});
    });
});

app.delete("/menu/:id", function(solicitud,respuesta){
    var id = solicitud.params.id;
    if(solicitud.body.pass == app_pass){
        Producto.remove({"_id": id}, function(err){
            if(err){console.log(err);}
            respuesta.redirect("/menu");
        });
    }else{
        respuesta.redirect("/menu");
    }
});

app.listen(3000);