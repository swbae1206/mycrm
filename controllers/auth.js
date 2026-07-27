import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { SolapiMessageService } from "solapi"

const messageService = new SolapiMessageService(
  "NCSWNH0CUNDBNHZP",
  "1GNRLP8BOSL6D1NAMP7YQUZDCSHG0CI6",
);

export const sendSMS = async (req, res) => {

  const { phone } = req.body

  function generateCode() {
    const characters = '0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  const code = generateCode()

  messageService
    .send({
      to: phone,
      from: '01085123770',
      text: `myCRM 인증번호 [${code}]`,
    })
    .then(() => {
      return res.status(200).json({ code: code });
    });
}

/* REGISTER USER */
export const register = async (req, res) => {
  
  try {
    let {
      name,
      phone,
      password,
      picturePath,
    } = req.body;

    if (picturePath !== "profile.jpg") picturePath = req.file.filename
    
    const exist = await User.findOne({ phone });
    if (exist) {
      throw new Error("이미 등록된 전화번호입니다.")
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      phone,
      password: passwordHash,
      picturePath,
      approval: false,
      companion: [
        {
          name: "단독",
          groups: ["미지정"],
        },
      ],
    });
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);

  } catch (err) {
    res.status(400).json(err.message);
  }
}

export const changePassword = async (req, res) => {
  
  try {
    let {
      userId,
      oldPassword,
      newPassword,
      passwordVerify
    } = req.body;

    const user = await User.findOne({ _id: userId });
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "기존 비밀번호가 일치하지 않습니다. " });
    }    

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const result = await User.findOneAndUpdate(
      { _id: userId },
      { $set: { password: passwordHash } },
      { new: true }
    )
    res.status(201).json(result);

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone: phone });
    if (!user) return res.status(400).json({ msg: "존재하지 않는 사용자입니다 " });

    if (user.approval === false) {
       throw new Error("관리자 승인이 되지 않았습니다. 관리자의 승인 후 사용가능합니다.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("비밀번호가 일치하지 않습니다.");


    if (user.suspended === true) {
       throw new Error("사용이 중지된 사용자입니다. 관리자에게 문의해주세요.");
    }

    const lastLogined = new Date().toISOString().slice(0, 10)

    const updatedUser = await User.findOneAndUpdate(
      { phone: phone },
      {
        lastLogined: lastLogined,
        $inc: {totalLogin: 1}
       },
      { new: true },
    );
  
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    delete user.password;
    res.status(200).json({ token, user });
  } catch (err) {
    res.status(400).json(err.message);
  }
};
