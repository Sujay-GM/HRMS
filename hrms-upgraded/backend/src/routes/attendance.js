const router = require('express').Router();
const ctrl = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/me',      ctrl.getMe);
router.get('/today',   ctrl.getToday);
router.get('/report',  authorize('admin', 'super_admin'), ctrl.getReport);
router.get('/',        ctrl.getAll);

router.post('/check-in',  ctrl.checkIn);
router.post('/check-out', ctrl.checkOut);

// Legacy routes (backward compat)
router.post('/checkin',          ctrl.checkIn);
router.put('/:id/checkout',      ctrl.checkOut);

module.exports = router;
