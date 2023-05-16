module.exports = (sequelize) => {
  const pollvotes = sequelize.define("pollvotes");

  pollvotes.associate = (models) => {
    pollvotes.belongsTo(models.users, {
      foreignKey: "userId",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
    pollvotes.belongsTo(models.pollchoices, {
      foreignKey: "pollchoicesId",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
    pollvotes.belongsTo(models.polls, {
      foreignKey: "pollId",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
  };
  return pollvotes;
};
