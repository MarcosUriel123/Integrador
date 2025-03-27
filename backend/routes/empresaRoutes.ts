// empresaRoutes.ts
import express from 'express';
import { Router } from 'express';
import {
    updateEmpresa,
    addPregunta,
    addMision,
    addVision,
    addValor,
    addPolitica,
    getEmpresa,
    getPreguntas,
    getMisiones,
    getVisiones,
    getValores,
    getPoliticas
} from '../controllers/empresaController';

const router: Router = express.Router();

// Rutas GET
router.get('/', getEmpresa); // Ahora es /api/empresa
router.get('/preguntas', getPreguntas); // /api/empresa/preguntas
router.get('/misiones', getMisiones);
router.get('/visiones', getVisiones);
router.get('/valores', getValores);
router.get('/politicas', getPoliticas);

// Rutas PUT y POST
router.put('/actualizar', updateEmpresa);
router.post('/preguntas', addPregunta);
router.post('/misiones', addMision);
router.post('/visiones', addVision);
router.post('/valores', addValor);
router.post('/politicas', addPolitica);

// Manejo de errores...
export default router;