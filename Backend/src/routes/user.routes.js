import express from 'express';
import {
  createUser,
  getUser,
  getUserPolls,
  updateUser,
  getUsersVotingHistory,
  login,
  signup,
} from '../controllers/user.controller.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/', createUser);
router.get('/:id', getUser);
router.get('/:id/polls', getUserPolls);
router.patch('/:id', updateUser);
router.get('/:id/history', getUsersVotingHistory);

export default router;