#include "jevvvery.h"

#include <debug.h>

#include <KPluginFactory>

K_PLUGIN_FACTORY_WITH_JSON(jevvveryFactory, "jevvvery.json", registerPlugin<jevvvery>(); )

jevvvery::jevvvery(QObject* parent, const KPluginMetaData& metaData, const QVariantList& args)
    : KDevelop::IPlugin(QStringLiteral("jevvvery"), parent, metaData)
{
    Q_UNUSED(args);

    qCDebug(PLUGIN_JEVVVERY) << "Hello world, my plugin is loaded!";
}

// needed for QObject class created from K_PLUGIN_FACTORY_WITH_JSON
#include "jevvvery.moc"
#include "moc_jevvvery.cpp"
