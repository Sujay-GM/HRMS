const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/',    authorize('super_admin'), ctrl.getAll);
router.get('/:id', authorize('super_admin'), ctrl.getById);
router.post('/',   authorize('super_admin'), ctrl.create);
router.put('/:id', authorize('super_admin'), ctrl.update);
router.delete('/:id', authorize('super_admin'), ctrl.remove);

module.exports = router;
