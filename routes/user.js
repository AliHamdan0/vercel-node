const { Router } = require('express');
const { users } = require('../users');
const router = Router();
router.post('enter-user', (req, res) => {
  const { username } = req.body;
  users.push({ id: users.length, username, socket: '', numOfMsg: 0 });
  res.status(200).json({ id: users.length - 1, username }); //because now the index has increased
});

router.get('user-socket', (req, res) => {
  const { id } = req.body;
  const index = users.findIndex((user) => user.id === id);
  if (users[index]) res.status(200).json({ user: users[index] });
  else res.status(200).json({ user: null });
});
module.exports = router;
