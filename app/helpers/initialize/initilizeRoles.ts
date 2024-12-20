import db from '../../models';

const Role = db.role;

export const initializeRoles = () => {
    Role.estimatedDocumentCount((err: any, count: any) => {
        if (!err && count === 0) {
            new Role({
                name: 'user',
            }).save((err: any) => {
                if (err) {
                    console.log('error', err);
                }

                console.log("added 'user' to roles collection");
            });

            new Role({
                name: 'moderator',
            }).save((err: any) => {
                if (err) {
                    console.log('error', err);
                }

                console.log("added 'moderator' to roles collection");
            });

            new Role({
                name: 'admin',
            }).save((err: any) => {
                if (err) {
                    console.log('error', err);
                }

                console.log("added 'admin' to roles collection");
            });
        }
    });
};
