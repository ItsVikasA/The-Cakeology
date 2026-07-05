import Razorpay from 'razorpay';
import { Config } from '../config/config.js';

const razorpay = new Razorpay({
    key_id: Config.RAZORPAY_KEY_ID,
    key_secret: Config.RAZORPAY_KEY_SECRET,
});

export default razorpay;

