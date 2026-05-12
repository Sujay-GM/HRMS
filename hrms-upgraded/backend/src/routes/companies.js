const router = require('express').Router();
const ctrl = require('../controllers/companyController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/',    authorize('super_admin'), ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/',   authorize('super_admin'), ctrl.create);
router.put('/:id', authorize('super_admin', 'admin'), ctrl.update);
router.delete('/:id', authorize('super_admin'), ctrl.remove);
router.get('/:id/stats', ctrl.getStats);

module.exports = router;
