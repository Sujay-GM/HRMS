const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/super-admin/stats',       authorize('super_admin'), ctrl.superAdminStats);
router.get('/super-admin/leave-stats', authorize('super_admin'), ctrl.superAdminLeaveStats);
router.get('/admin/stats',             authorize('admin'),       ctrl.adminStats);
router.get('/employee/stats',          authorize('employee'),    ctrl.employeeStats);

module.exports = router;
