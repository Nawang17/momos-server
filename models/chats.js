module.exports = (sequelize, DataTypes) => {
  const chats = sequelize.define("chats", {
    message: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
  });
  chats.associate = (models) => {
    chats.belongsTo(models.chatrooms, {
      foreignKey: "chatroomid",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
    chats.belongsTo(models.users, {
      foreignKey: "userid",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
  };

  return chats;
};
