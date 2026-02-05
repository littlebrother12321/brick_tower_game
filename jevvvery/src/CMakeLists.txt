set(jevvvery_SRCS
    jevvvery.cpp
)

ecm_qt_declare_logging_category(jevvvery_SRCS
    HEADER debug.h
    IDENTIFIER PLUGIN_JEVVVERY
    CATEGORY_NAME "kdevelop.plugins.jevvvery"
    DESCRIPTION "KDevelop plugin: jevvvery"
    EXPORT JEVVVERY
)

kdevplatform_add_plugin(jevvvery
    SOURCES ${jevvvery_SRCS}
)

target_link_libraries(jevvvery
    KDev::Interfaces
)
