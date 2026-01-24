const Wallet = require('../models/Wallet');
const User = require('../models/User');

exports.getMyWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user._id });

    if (!wallet) {
      wallet = await Wallet.create({
        userId: req.user._id,
        balance: 0,
        transactions: [],
      });
    }

    res.status(200).json({
      success: true,
      data: wallet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getAllWallets = async (req, res) => {
  try {
    const wallets = await Wallet.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: wallets.length,
      data: wallets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.addTransaction = async (req, res) => {
  try {
    const { type, amount, description, referenceId } = req.body;

    if (!type || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Please provide type and amount'
      });
    }

    let wallet = await Wallet.findOne({ userId: req.user._id });

    if (!wallet) {
      wallet = await Wallet.create({
        userId: req.user._id,
        balance: 0,
        transactions: [],
      });
    }

    const transaction = {
      type,
      amount: parseFloat(amount),
      description: description || null,
      referenceId: referenceId || null,
      createdAt: new Date(),
    };

    if (type === 'credit') {
      wallet.balance += parseFloat(amount);
      wallet.totalEarned += parseFloat(amount);
    } else if (type === 'debit') {
      if (wallet.balance < parseFloat(amount)) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient balance'
        });
      }
      wallet.balance -= parseFloat(amount);
      wallet.totalWithdrawn += parseFloat(amount);
    }

    wallet.transactions.push(transaction);
    await wallet.save();

    res.status(200).json({
      success: true,
      message: 'Transaction added successfully',
      data: wallet
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.withdraw = async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid withdrawal amount'
      });
    }

    let wallet = await Wallet.findOne({ userId: req.user._id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    if (wallet.balance < parseFloat(amount)) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance'
      });
    }

    const transaction = {
      type: 'debit',
      amount: parseFloat(amount),
      description: description || 'Withdrawal',
      createdAt: new Date(),
    };

    wallet.balance -= parseFloat(amount);
    wallet.totalWithdrawn += parseFloat(amount);
    wallet.transactions.push(transaction);
    await wallet.save();

    res.status(200).json({
      success: true,
      message: 'Withdrawal processed successfully',
      data: wallet
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

