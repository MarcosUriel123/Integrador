// Ruta: Integrador/backend/controllers/productController.ts
import { Request, Response } from 'express';
import Product from '../models/productModel';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find({});
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los productos', error });
  }
};

export const addProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, category, image } = req.body;
    const newProduct = new Product({ name, description, price, category, image });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error al agregar el producto', error });
  }
};