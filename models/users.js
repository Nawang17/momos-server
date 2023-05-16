module.exports = (sequelize, DataTypes) => {
  const users = sequelize.define("users", {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: "username",
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    imagekey: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },

    verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "active",
    },
    imagekey: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
  });
  users.associate = (models) => {
    users.hasMany(models.posts, {
      foreignKey: "postUser",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    users.hasMany(models.likes, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    users.hasMany(models.pollvotes, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    users.hasMany(models.comments, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    users.hasMany(models.nestedcomments, {
      foreignKey: "repliedtouserId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    users.hasMany(models.nestedcomments, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    users.hasMany(models.notis, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    users.hasMany(models.notis, {
      foreignKey: "targetuserId",
      onDelete: "CASCADE",
    });
    users.hasMany(models.follows, {
      foreignKey: "followerid",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });

    users.hasMany(models.follows, {
      foreignKey: "followingid",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    users.hasMany(models.follows, {
      foreignKey: "userid",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    users.hasMany(models.commentlikes, {
      foreignKey: "userId",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
    users.hasMany(models.nestedcommentlikes, {
      foreignKey: "userId",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
    users.hasMany(models.chatrooms, {
      foreignKey: "user1",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
    users.hasMany(models.chatrooms, {
      foreignKey: "user2",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
    users.hasMany(models.chats, {
      foreignKey: "userid",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    users.hasOne(models.profilebanners, {
      foreignKey: "userid",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
  };
  return users;
};
