// Backend/src/routes/user.routes.js
import express from 'express';
import {
  createUser,
  getUser,
  getUserPolls,
  updateUser,
  getUsersVotingHistory,
} from '../controllers/user.controller.js';

const router = express.Router();

router.post('/', createUser);
router.get('/:id', getUser);
router.get('/:id/polls', getUserPolls);
router.patch('/:id', updateUser);
router.get('/:id/history', getUsersVotingHistory);

export default router;