module.exports = (sequelize, DataTypes) => {
  const translations = sequelize.define("translations", {
    translatedText: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    language: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  translations.associate = (models) => {
    translations.belongsTo(models.posts, {
      foreignKey: "postId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
  };

  return translations;
};
