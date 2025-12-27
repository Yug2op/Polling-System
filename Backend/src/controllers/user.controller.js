// Backend/src/controllers/user.controller.js
import { AppError } from '../utils/AppError.js';
import User from '../models/user.js';
import Poll from '../models/Poll.js'

export const createUser = async (req, res, next) => {
  try {
    const { name, role } = req.body;
    
    const userExists = await User.findOne({ name });
    if (userExists) {
      throw new AppError('User with this name already exists', 400);
    }

    const user = await User.create({
      name,
      role,
    });
    
    res.status(201).json({ 
      success: true, 
      data: user 
    });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-__v')
      .lean();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const getUserPolls = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { createdBy: req.params.id };
    
    if (status) {
      filter.status = status;
    }

    const polls = await Poll.find(filter)
      .sort({ createdAt: -1 })
      .select('-participants')
      .lean();

    res.json({ success: true, data: polls });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { name, role } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, role },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const getUsersVotingHistory = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      return next(new AppError('User identification is missing', 400));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const history = await user.getVotingHistory();

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    next(error);
  }
};