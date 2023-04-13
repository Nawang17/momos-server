module.exports = (sequelize, DataTypes) => {
  const polls = sequelize.define("polls", {
    duration: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  polls.associate = (models) => {
    polls.belongsTo(models.posts, {
      foreignKey: "postId",
      onDelete: "CASCADE",
    });
    polls.hasMany(models.pollchoices, {
      foreignKey: "pollId",
      onDelete: "CASCADE",
    });
    polls.hasMany(models.pollvotes, {
      foreignKey: "pollId",
      onDelete: "CASCADE",
    });
  };
  return polls;
};
