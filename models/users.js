module.exports = (sequelize, DataTypes) => {
  const users = sequelize.define("users", {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
  });
  users.associate = (models) => {
    users.hasMany(models.posts, {
      foreignKey: "postUser",
      onDelete: "CASCADE",
    });
    users.hasMany(models.likes, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
    users.hasMany(models.comments, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
    // users.hasMany(models.notis, {
    //   foreignKey: "userId",
    //   onDelete: "CASCADE",
    // });
  };
  return users;
};
