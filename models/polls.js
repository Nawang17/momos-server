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
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
    polls.hasMany(models.pollchoices, {
      foreignKey: "pollId",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
    polls.hasMany(models.pollvotes, {
      foreignKey: "pollId",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
  };
  return polls;
};
