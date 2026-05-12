const router = require('express').Router();
const ctrl = require('../controllers/leaveController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/',              ctrl.getAll);
router.post('/',             ctrl.create);
router.put('/:id/approve',   authorize('admin', 'super_admin'), ctrl.approve);
router.put('/:id/reject',    authorize('admin', 'super_admin'), ctrl.reject);
router.delete('/:id',        ctrl.remove);

module.exports = router;
