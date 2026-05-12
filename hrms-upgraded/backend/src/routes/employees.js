const router = require('express').Router();
const ctrl = require('../controllers/employeeController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/',   authorize('admin', 'super_admin'), ctrl.create);
router.put('/:id', authorize('admin', 'super_admin'), ctrl.update);
router.delete('/:id', authorize('admin', 'super_admin'), ctrl.remove);

module.exports = router;
