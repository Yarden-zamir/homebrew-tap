# typed: false
# frozen_string_literal: true

class GhSource < Formula
  desc "Plugin manager for people who don't like plugin managers"
  homepage "https://github.com/Yarden-zamir/gh-source"
  url "https://github.com/Yarden-zamir/gh-source/archive/refs/tags/v2.0.0.tar.gz"
  sha256 "dbdab57216296560fe0a39b06d5966f562fa6e9b549a1abdf2e9dfc1851bc118"
  license "MIT"

  depends_on "gh"

  def install
    pkgshare.install "gh-source.zsh"
    pkgshare.install "zsh-completion"
  end

  def caveats
    <<~EOS
      To activate gh-source, add the following at the end of your .zshrc:
        source #{opt_pkgshare}/gh-source.zsh
    EOS
  end

  test do
    assert_match "Usage:", shell_output("zsh -fc 'source #{pkgshare}/gh-source.zsh; gh_source --help'")
  end
end
