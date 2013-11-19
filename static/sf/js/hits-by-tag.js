var StrikeFinder = StrikeFinder || {};

StrikeFinder.HitsByTagTableView = StrikeFinder.TableView.extend({
    initialize: function () {
        var view = this;

        view.options['aoColumns'] = [
            {sTitle: "uuid", mData: "uuid", bVisible: false, bSortable: false},
            {sTitle: "Updated", mData: "updated", sClass: 'nowrap', bSortable: false},
            {sTitle: "Cluster", mData: "cluster_name", bSortable: false},
            {sTitle: "Host", mData: "hostname", bSortable: false},
            {sTitle: "am_cert_hash", mData: "am_cert_hash", bVisible: false, bSortable: false},
            {sTitle: "Item Type", mData: "rowitem_type", bSortable: false, bVisible: false},
            {sTitle: "Tag", mData: "tagname", bVisible: false, bSortable: false},
            {sTitle: "Summary", mData: "summary1", sClass: 'wrap', sWidth: '30%', bSortable: false},
            {sTitle: "Summary2", mData: "summary2", sClass: 'wrap', sWidth: '30%', bSortable: false},
            {sTitle: "MD5sum", mData: "md5sum", bSortable: false, bVisible: false},
            {sTitle: "Owner", mData: "username", bSortable: false, bVisible: false}
        ];

        view.options.aoColumnDefs = [
            {
                mRender: function (data, type, row) {
                    return StrikeFinder.format_date_string(data);
                },
                aTargets: [1]
            }
        ];

        view.options.oLanguage = {
            sEmptyTable: 'No hits were found for the specified tag'
        };

        view.options.aaSorting = [];
        view.options.sDom = 'l<"<sf-table-wrapper"t>ip';

        view.options.sAjaxSource = '/sf/api/hits';
        view.options.sAjaxDataProp = 'results';
        view.options.bServerSide = true;
    }
});

StrikeFinder.HitsByTagView = StrikeFinder.View.extend({
    initialize: function () {
        var view = this;

        // Create a tag filter drop down.
        view.tags = new StrikeFinder.TagCollection();
        view.select_tag_view = new StrikeFinder.SelectView({
            el: "#tag-select",
            collection: view.tags,
            id_field: "name",
            value_field: "name",
            width: "200px"
        });
        view.listenTo(view.select_tag_view, 'change', function(value) {
            view.tagname = value;
            view.render();
        });

        view.hits_collapsable = new StrikeFinder.CollapsableContentView({
            el: '#hits-table'
        });

        view.hits_table_view = new StrikeFinder.HitsByTagTableView({
            el: '#hits-table'
        });
        view.listenTo(view.hits_table_view, 'load', function () {
            view.hits_table_view.select_row(0);
            view.set_title(_.sprintf('%s (%s)', view.tagname, view.hits_table_view.get_total_rows()));
        });

        // Create the hits details view.
        view.hits_details_view = new StrikeFinder.HitsDetailsView({
            el: '#hits-details-div',
            hits_table_view: view.hits_table_view
        });

        // The criteria container.
        view.criteria = new StrikeFinder.HitsCriteria();

        // Hits facets.
        view.facets = new StrikeFinder.HitsFacetsModel();
        view.facets_view = new StrikeFinder.HitsFacetsView({
            el: '#hits-facets-div',
            model: view.facets
        });

        // Listen to criteria changes and reload the views.
        view.listenTo(view.criteria, 'refresh', function(attributes) {
            // Reload the facets.
            view.facets.params = attributes;
            view.facets.fetch();

            // Reload the hits.
            view.hits_table_view.fetch(attributes);
        });

        view.listenTo(view.facets_view, 'selected', function(type, value) {
            console.log(_.sprintf('Selected %s, %s', type, value));
            StrikeFinder.run(function() {
                log.debug(_.sprintf('selected: %s, %s', type, value));
                view.criteria.add(type, value);
                view.criteria.refresh();
            });
        });

        view.listenTo(view.facets_view, 'reset', function() {
            StrikeFinder.run(function() {
                // User reset the filter criteria.
                view.criteria.reset();
            });
        });

        // Load the searchable tags list.
        view.tags.reset(StrikeFinder.searchable_tags);
    },
    render: function() {
        var view = this;
        log.debug('Rendering hits for tagname: ' + view.tagname);

        StrikeFinder.run(function() {
            view.criteria.set_initial({tagname: view.tagname});
            view.criteria.refresh();
        });
    },
    set_title: function(title) {
        this.hits_collapsable.set('title', '<i class="fa fa-tag"></i> ' + title);
    }
});
