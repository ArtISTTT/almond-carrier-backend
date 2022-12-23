import mongoose from "mongoose";
import { RoleModel } from "./role.model";
import { UserModel } from "./user.model";

mongoose.Promise = global.Promise;

const db: any = {};

db.mongoose = mongoose;

db.user = UserModel;
db.role = RoleModel;

db.ROLES = ["user", "admin", "moderator"];

export default db;
