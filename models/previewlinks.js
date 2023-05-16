module.exports = (sequelize, DataTypes) => {
  const previewlinks = sequelize.define("previewlinks", {
    title: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
  });

  previewlinks.associate = (models) => {
    previewlinks.belongsTo(models.posts, {
      foreignKey: "postId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
  };
  return previewlinks;
};
