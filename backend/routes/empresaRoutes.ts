import express from 'express';
import { Router } from 'express';
import {
    updateEmpresaData,
    addPregunta,
    addMision,
    addVision,
    addValor,
    addPolitica,
    getEmpresa,
    getPreguntas,
    getMisions,
    getVisions,
    getValors,
    getPoliticas
} from '../controllers/empresaController';

const router: Router = express.Router();

// Rutas PUT y POST para crear y actualizar datos
router.put('/empresa/actualizar-todos', updateEmpresaData);
router.post('/empresa/preguntas', addPregunta);
router.post('/empresa/misiones', addMision);
router.post('/empresa/visiones', addVision);
router.post('/empresa/valores', addValor);
router.post('/empresa/politicas', addPolitica);

// Rutas GET para obtener datos
router.get('/empresa', getEmpresa);
router.get('/empresa/preguntas', getPreguntas);
router.get('/empresa/misiones', getMisions);
router.get('/empresa/visiones', getVisions);
router.get('/empresa/valores', getValors);
router.get('/empresa/politicas', getPoliticas);

export default router;
