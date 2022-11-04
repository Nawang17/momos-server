module.exports = (sequelize, DataTypes) => {
  const posts = sequelize.define("posts", {
    text: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    imagekey: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
  });
  posts.associate = (models) => {
    posts.belongsTo(models.users, {
      foreignKey: "postUser",

      onDelete: "CASCADE",
    });
    posts.hasMany(models.likes, {
      foreignKey: "postId",
      onDelete: "CASCADE",
    });
    posts.hasMany(models.comments, {
      foreignKey: "postId",
      onDelete: "CASCADE",
    });
    posts.hasMany(models.nestedcomments, {
      foreignKey: "postId",
      onDelete: "CASCADE",
    });
    posts.hasMany(models.notis, {
      foreignKey: "postId",
      onDelete: "CASCADE",
    });
  };
  return posts;
};
