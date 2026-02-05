#ifndef JEVVVERY_H
#define JEVVVERY_H

#include <interfaces/iplugin.h>

class jevvvery : public KDevelop::IPlugin
{
    Q_OBJECT

public:
    // KPluginFactory-based plugin wants constructor with this signature
    jevvvery(QObject* parent, const KPluginMetaData& metaData, const QVariantList& args);
};

#endif // JEVVVERY_H
