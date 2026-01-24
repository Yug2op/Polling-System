import { AppError } from '../utils/AppError.js';
import User from '../models/User.js';
import Poll from '../models/Poll.js'

export const createUser = async (req, res, next) => {
  try {
    const { name, role, password } = req.body;
    
    const userExists = await User.findOne({ name });
    if (userExists) {
      throw new AppError('User with this name already exists', 400);
    }

    const user = await User.create({
      name,
      role,
      password,
    });
    
    res.status(201).json({ 
      success: true, 
      data: user 
    });
  } catch (error) {
    next(error);
  }
};

export const signup = async (req, res, next) => {
  try {
    const { name, role, password } = req.body;
    
    if (!name || !role || !password) {
      throw new AppError('Name, role, and password are required', 400);
    }

    const existingUser = await User.findOne({ name });
    if (existingUser) {
      throw new AppError('User with this name already exists', 400);
    }

    const user = await User.create({
      name,
      role,
      password,
    });

    const userResponse = {
      _id: user._id,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };

    res.status(201).json({ 
      success: true, 
      data: userResponse 
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { name, password, role } = req.body;
    
    if (!name || !password || !role) {
      throw new AppError('Name, password, and role are required', 400);
    }

    const user = await User.findOne({ name, role }).select('+password');
    
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const userResponse = {
      _id: user._id,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };

    res.status(200).json({ 
      success: true, 
      data: userResponse 
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