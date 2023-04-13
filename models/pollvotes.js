module.exports = (sequelize) => {
  const pollvotes = sequelize.define("pollvotes");

  pollvotes.associate = (models) => {
    pollvotes.belongsTo(models.users, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
    pollvotes.belongsTo(models.pollchoices, {
      foreignKey: "pollchoicesId",
      onDelete: "CASCADE",
    });
    pollvotes.belongsTo(models.polls, {
      foreignKey: "pollId",
      onDelete: "CASCADE",
    });
  };
  return pollvotes;
};
