module.exports = (sequelize, DataTypes) => {
  const chatrooms = sequelize.define("chatrooms", {
    roomid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: "roomid",
    },
    user1Closed: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    user2Closed: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  });
  chatrooms.associate = (models) => {
    chatrooms.belongsTo(models.users, {
      as: "userone",

      foreignKey: "user1",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });

    chatrooms.belongsTo(models.users, {
      as: "usertwo",
      foreignKey: "user2",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
    chatrooms.hasMany(models.chats, {
      foreignKey: "chatroomid",

      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
  };

  return chatrooms;
};
