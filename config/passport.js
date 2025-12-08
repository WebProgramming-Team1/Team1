const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');

module.exports = function (passport) {
    passport.use(
        new LocalStrategy(
            {
                usernameField: 'username', // req.body.username
                passwordField: 'password', // req.body.password
                session: true,
            },
            async (username, password, done) => {
                try {
                    const user = await userModel.findByUsername(username);

                    if (!user) {
                        return done(null, false, { message: '존재하지 않는 아이디입니다.' });
                    }

                    const match = await bcrypt.compare(password, user.password_hash);

                    if (!match) {
                        return done(null, false, { message: '비밀번호가 올바르지 않습니다.' });
                    }

                    // 로그인 성공
                    return done(null, user);
                } catch (err) {
                    return done(err);
                }
            },
        ),
    );

    // 세션에 넣을 값
    passport.serializeUser((user, done) => {
        done(null, user.id); // 세션에는 user.id만 저장
    });

    // 세션에서 id를 꺼내서 유저 조회
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await userModel.findById(id);

            if (!user) {
                return done(null, false);
            }

            return done(null, user);
        } catch (err) {
            return done(err);
        }
    });
};
