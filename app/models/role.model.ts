const mongoose = require('mongoose');

export const RoleModel = mongoose.model(
    'Role',
    new mongoose.Schema({
        name: String,
    })
);
