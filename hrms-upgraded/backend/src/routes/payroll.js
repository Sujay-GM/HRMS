const router = require('express').Router();
const ctrl = require('../controllers/payrollController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/',           ctrl.getAll);
router.post('/run',       authorize('admin', 'super_admin'), ctrl.runPayroll);
router.put('/:id/pay',    authorize('admin', 'super_admin'), ctrl.markPaid);

module.exports = router;
