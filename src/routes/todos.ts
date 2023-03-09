import express from "express";
const todosRouter = express.Router();
import todosController from '../controllers/todosController.js';

todosRouter.route('/')
    .get(todosController.getTodos)
    .post(todosController.addTodo)
    .put(todosController.updateTodo)
    .delete(todosController.deleteTodo)

export default todosRouter;