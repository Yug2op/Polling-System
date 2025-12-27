import express from 'express';
import {
  createPoll,
  getPolls,
  getPoll,
  startPoll,
  endPollManual,
  submitVote,
  getPollResults,
} from '../controllers/poll.controller.js';

const router = express.Router();

router.post('/', createPoll);
router.get('/', getPolls);
router.get('/:id', getPoll);
router.post('/:id/start', startPoll);
router.post('/:id/end', endPollManual);
router.post('/:id/vote', submitVote);
router.get('/:id/results', getPollResults);

export default router;