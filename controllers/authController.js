const jwt = require('jsonwebtoken');

const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');

const createSendToken = (
  options = { user: null, statusCode: null, res: null }
) => {
  const { user, statusCode, res } = options;

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: `${process.env.JWT_EXPIRY_DAYS} days`
  });

  const cookieExpiry = new Date(
    Date.now() + process.env.JWT_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  const cookieOptions = {
    httpOnly: true,
    expires: cookieExpiry,
    secure: process.env.NODE_ENV === 'production'
  };

  res
    .status(statusCode)
    .cookie('jwt', token, cookieOptions)
    .json({
      status: 'success',
      data: {
        user,
        token
      }
    });
};

exports.register = catchAsync(async (req, res, next) => {
  const { email, password, confirmPassword } = req.body;

  const user = await User.create({ email, password, confirmPassword });

  createSendToken({ user, statusCode: 201, res });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePasswords(password, user.password))) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid login credentials'
    });
  }

  createSendToken({ user, res, statusCode: 200 });
});

exports.getUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    data: {
      count: users.length,
      users
    }
  });
});