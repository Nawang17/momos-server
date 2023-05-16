module.exports = (sequelize, DataTypes) => {
  const pollchoices = sequelize.define("pollchoices", {
    choice: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  pollchoices.associate = (models) => {
    pollchoices.belongsTo(models.polls, {
      foreignKey: "pollId",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
    pollchoices.hasMany(models.pollvotes, {
      foreignKey: "pollchoicesId",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
  };
  return pollchoices;
};
