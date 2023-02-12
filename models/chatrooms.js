module.exports = (sequelize, DataTypes) => {
  const chatrooms = sequelize.define("chatrooms", {
    roomid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: "roomid",
    },
  });
  chatrooms.associate = (models) => {
    chatrooms.belongsTo(models.users, {
      as: "userone",

      foreignKey: "user1",
      onDelete: "CASCADE",
    });

    chatrooms.belongsTo(models.users, {
      as: "usertwo",
      foreignKey: "user2",
      onDelete: "CASCADE",
    });
    chatrooms.hasMany(models.chats, {
      foreignKey: "chatroomid",

      onDelete: "CASCADE",
    });
  };

  return chatrooms;
};
