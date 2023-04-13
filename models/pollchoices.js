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
      onDelete: "CASCADE",
    });
    pollchoices.hasMany(models.pollvotes, {
      foreignKey: "pollchoicesId",
      onDelete: "CASCADE",
    });
  };
  return pollchoices;
};
