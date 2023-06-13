module.exports = (sequelize, DataTypes) => {
  const posts = sequelize.define("posts", {
    text: {
      type: DataTypes.STRING(500),
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
    filetype: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    hasquote: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    gif: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
  });
  posts.associate = (models) => {
    posts.belongsTo(models.users, {
      foreignKey: "postUser",

      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    posts.hasMany(models.likes, {
      foreignKey: "postId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    posts.hasOne(models.previewlinks, {
      foreignKey: "postId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    posts.hasOne(models.polls, {
      foreignKey: "postId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });

    posts.hasMany(models.comments, {
      foreignKey: "postId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    posts.hasMany(models.nestedcomments, {
      foreignKey: "postId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    posts.hasMany(models.notis, {
      foreignKey: "postId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    posts.belongsTo(models.posts, {
      foreignKey: "quoteId",
      foreignKeyConstraint: true,
    });
    posts.hasMany(models.postquotes, {
      foreignKey: "postId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    posts.hasMany(models.postquotes, {
      foreignKey: "quotedPostId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    posts.hasMany(models.bookmarks, {
      foreignKey: "postId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
  };
  return posts;
};
